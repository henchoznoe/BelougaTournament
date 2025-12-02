'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createTournamentDirect } from '@/lib/actions/tournaments'
import { cn } from '@/lib/utils'

const formSchema = z.object({
	description: z.string().min(10, 'Description must be at least 10 characters'),
	endDate: z.date(),
	fields: z.array(
		z.object({
			label: z.string().min(1, 'Label is required'),
			required: z.boolean().default(true),
			type: z.enum([
				'TEXT',
				'NUMBER',
				'SELECT',
				'CHECKBOX',
				'DISCORD_ID',
				'RIOT_ID',
			]),
		}),
	),
	format: z.enum(['SOLO', 'TEAM']),
	maxParticipants: z.coerce.number().optional(),
	registrationClose: z.date(),
	registrationOpen: z.date(),
	slug: z.string().min(3, 'Slug must be at least 3 characters'),
	startDate: z.date(),
	streamUrl: z.string().optional(),
	teamSize: z.coerce.number().min(1),
	title: z.string().min(3, 'Title must be at least 3 characters'),
})

export default function CreateTournamentPage() {
	const form = useForm({
		defaultValues: {
			description: '',
			fields: [],
			format: 'SOLO',
			slug: '',
			teamSize: 1,
			title: '',
		},
		resolver: zodResolver(formSchema),
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'fields',
	})

	async function onSubmit(values: z.infer<typeof formSchema>) {
		// We need to match the server action signature.
		// The server action expects the exact Zod schema shape.
		// However, we are passing Date objects, but we want to ensure they are passed correctly.
		// Next.js Server Actions support Date objects.

		await createTournamentDirect(values)
	}

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			<div className="flex items-center justify-between">
				<h1 className="font-bold text-3xl text-white">Create Tournament</h1>
			</div>

			<Form {...form}>
				<form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
					<Card className="border-zinc-800 bg-zinc-950">
						<CardHeader>
							<CardTitle>General Information</CardTitle>
							<CardDescription>
								Basic details about the tournament.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-6">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="title"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Title</FormLabel>
											<FormControl>
												<Input placeholder="Belouga Cup #1" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="slug"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Slug</FormLabel>
											<FormControl>
												<Input placeholder="belouga-cup-1" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Tournament rules and details..."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								{/* Date Pickers would go here - simplified for brevity, using Input type="date" or Calendar */}
								{/* For this artifact, I'll use standard Calendar components wrapped in Popover as per Shadcn */}
								{[
									'startDate',
									'endDate',
									'registrationOpen',
									'registrationClose',
								].map(dateField => (
									<FormField
										control={form.control}
										key={dateField}
										name={dateField as any}
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel className="capitalize">
													{dateField.replace(/([A-Z])/g, ' $1').trim()}
												</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																className={cn(
																	'w-full pl-3 text-left font-normal',
																	!field.value && 'text-muted-foreground',
																)}
																variant={'outline'}
															>
																{field.value ? (
																	format(field.value, 'PPP')
																) : (
																	<span>Pick a date</span>
																)}
																<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent align="start" className="w-auto p-0">
														<Calendar
															disabled={date => date < new Date('1900-01-01')}
															initialFocus
															mode="single"
															onSelect={field.onChange}
															selected={field.value}
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>
								))}
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
								<FormField
									control={form.control}
									name="format"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Format</FormLabel>
											<Select
												defaultValue={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select format" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="SOLO">Solo</SelectItem>
													<SelectItem value="TEAM">Team</SelectItem>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="teamSize"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Team Size</FormLabel>
											<FormControl>
												<Input
													type="number"
													{...field}
													value={field.value as number}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="maxParticipants"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Max Participants</FormLabel>
											<FormControl>
												<Input
													type="number"
													{...field}
													value={field.value as number}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					<Card className="border-zinc-800 bg-zinc-950">
						<CardHeader className="flex flex-row items-center justify-between">
							<div>
								<CardTitle>Registration Fields</CardTitle>
								<CardDescription>
									Define dynamic fields for player registration.
								</CardDescription>
							</div>
							<Button
								onClick={() =>
									append({ label: '', required: true, type: 'TEXT' })
								}
								size="sm"
								type="button"
								variant="outline"
							>
								<Plus className="mr-2 h-4 w-4" />
								Add Field
							</Button>
						</CardHeader>
						<CardContent className="space-y-4">
							{fields.map((field, index) => (
								<div
									className="flex items-end gap-4 rounded-md border border-zinc-800 p-4"
									key={field.id}
								>
									<FormField
										control={form.control}
										name={`fields.${index}.label`}
										render={({ field }) => (
											<FormItem className="flex-1">
												<FormLabel>Label</FormLabel>
												<FormControl>
													<Input placeholder="e.g. Rank" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`fields.${index}.type`}
										render={({ field }) => (
											<FormItem className="w-[150px]">
												<FormLabel>Type</FormLabel>
												<Select
													defaultValue={field.value}
													onValueChange={field.onChange}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="TEXT">Text</SelectItem>
														<SelectItem value="NUMBER">Number</SelectItem>
														<SelectItem value="SELECT">Select</SelectItem>
														<SelectItem value="CHECKBOX">Checkbox</SelectItem>
														<SelectItem value="DISCORD_ID">
															Discord ID
														</SelectItem>
														<SelectItem value="RIOT_ID">Riot ID</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`fields.${index}.required`}
										render={({ field }) => (
											<FormItem className="flex flex-col items-center gap-2 pb-2">
												<FormLabel>Required</FormLabel>
												<FormControl>
													<Checkbox
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									<Button
										className="text-red-500 hover:text-red-400"
										onClick={() => remove(index)}
										size="icon"
										type="button"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							))}
							{fields.length === 0 && (
								<div className="py-8 text-center text-muted-foreground text-sm">
									No custom fields added.
								</div>
							)}
						</CardContent>
					</Card>

					<div className="flex justify-end">
						<Button size="lg" type="submit">
							Create Tournament
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}
